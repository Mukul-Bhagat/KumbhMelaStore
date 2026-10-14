import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type DraftValue = string | number | boolean | null
type DraftRecord = Record<string, DraftValue>
export type CrudFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'json' | 'url' | 'email'

export interface CrudField {
  name: string
  label: string
  type: CrudFieldType
  placeholder?: string
  helperText?: string
  required?: boolean
  nullable?: boolean
  defaultValue?: DraftValue
  options?: Array<{ label: string; value: string }>
  getValue?: (row: Record<string, unknown>) => unknown
}

export interface CrudColumn<Row extends Record<string, unknown>> {
  label: string
  render: (row: Row) => ReactNode
  className?: string
}

export interface AdminResourcePanelProps<Row extends Record<string, unknown>> {
  title: string
  description: string
  rows: Row[]
  fields: CrudField[]
  columns: Array<CrudColumn<Row>>
  rowKey: keyof Row & string
  createLabel?: string
  canCreate?: boolean
  onCreate?: (values: Record<string, unknown>) => Promise<void>
  onUpdate?: (row: Row, values: Record<string, unknown>) => Promise<void>
  onDelete?: (row: Row) => Promise<void>
  onRefresh?: () => void
}

function toDraft(row: Record<string, unknown> | null, fields: CrudField[]) {
  return fields.reduce<DraftRecord>((acc, field) => {
    const value = row ? field.getValue?.(row) ?? row[field.name] : undefined

    if (field.type === 'boolean') {
      acc[field.name] = row ? Boolean(value) : Boolean(field.defaultValue ?? false)
      return acc
    }

    if (field.type === 'number') {
      if ((value === '' || value == null) && field.nullable !== false) {
        acc[field.name] = null
        return acc
      }

      acc[field.name] = typeof value === 'number' ? value : Number(value ?? 0)
      return acc
    }

    if (field.type === 'json' && value != null) {
      acc[field.name] = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      return acc
    }

    if (field.type === 'select') {
      const text = typeof value === 'string' ? value.trim() : ''
      acc[field.name] = text || (row ? (field.nullable === false ? '' : null) : field.defaultValue ?? (field.nullable === false ? '' : null))
      return acc
    }

    const text = typeof value === 'string' ? value.trim() : ''
    acc[field.name] = text.length > 0 || field.nullable === false
      ? text
      : row
        ? null
        : field.defaultValue ?? null
    return acc
  }, {})
}

function serializeDraft(draft: DraftRecord, fields: CrudField[]) {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    const value = draft[field.name]

    if (field.type === 'boolean') {
      acc[field.name] = Boolean(value)
      return acc
    }

    if (field.type === 'number') {
      acc[field.name] =
        value == null && field.nullable !== false ? null : Number(value ?? 0)
      return acc
    }

    if (field.type === 'json') {
      const text = typeof value === 'string' ? value.trim() : ''
      acc[field.name] = text ? JSON.parse(text) : null
      return acc
    }

    if (field.type === 'select') {
      const text = typeof value === 'string' ? value.trim() : ''
      acc[field.name] = text || (field.nullable === false ? '' : null)
      return acc
    }

    const text = typeof value === 'string' ? value.trim() : ''
    acc[field.name] = text || (field.nullable === false ? '' : null)
    return acc
  }, {})
}

function describeSaveError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to save changes.'
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''

  if (code === '42501' || /row-level security/i.test(message)) {
    return `Supabase rejected this change under row-level security. Verify that this account has the super_admin role and the database migrations are applied. Original error: ${message}`
  }

  return message
}

export function AdminResourcePanel<Row extends Record<string, unknown>>({
  title,
  description,
  rows,
  fields,
  columns,
  rowKey,
  createLabel = 'Add item',
  canCreate = true,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}: AdminResourcePanelProps<Row>) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<Row | null>(null)
  const [draft, setDraft] = useState<DraftRecord>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isEditing = activeRow !== null

  const rowLabel = useMemo(() => {
    const primaryField = fields[0]?.name
    return (row: Row) => {
      const value = primaryField ? row[primaryField] : row[rowKey]
      return typeof value === 'string' ? value : String(value)
    }
  }, [fields, rowKey])

  const openEditor = (row: Row | null) => {
    setEditorOpen(true)
    setActiveRow(row)
    setDraft(toDraft(row, fields))
    setFormError(null)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setActiveRow(null)
    setDraft({})
    setFormError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSaving(true)

    try {
      const payload = serializeDraft(draft, fields)

      if (activeRow) {
        if (!onUpdate) {
          return
        }

        await onUpdate(activeRow, payload)
      } else {
        if (!onCreate) {
          return
        }

        await onCreate(payload)
      }

      closeEditor()
      onRefresh?.()
    } catch (error) {
      setFormError(describeSaveError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {deleteError ? (
            <Alert
              title="Unable to delete item"
              description={deleteError}
              variant="error"
            />
          ) : null}
          {canCreate && onCreate ? (
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" />
              {createLabel}
            </Button>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.label}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {column.label}
                  </th>
                ))}
                {onUpdate || onDelete ? (
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={String(row[rowKey])}>
                    {columns.map((column) => (
                      <td key={column.label} className="px-4 py-4 align-top">
                        <div className={column.className}>{column.render(row)}</div>
                      </td>
                    ))}
                    {onUpdate || onDelete ? (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {onUpdate ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditor(row)}>
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!window.confirm(`Delete ${rowLabel(row)}?`)) {
                                  return
                                }

                                setDeleteError(null)
                                try {
                                  await onDelete(row)
                                  onRefresh?.()
                                } catch (error) {
                                  setDeleteError(describeSaveError(error))
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (onUpdate || onDelete ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Dialog
          open={editorOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeEditor()
            }
          }}
          title={isEditing ? `Edit ${title}` : `New ${title}`}
          description={isEditing ? `Update the selected ${title.toLowerCase()}.` : `Create a new ${title.toLowerCase()}.`}
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveRow(null)
                  setDraft({})
                }}
              >
                Cancel
              </Button>
              <Button type="submit" form={`crud-form-${title}`} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          }
        >
          <form id={`crud-form-${title}`} onSubmit={handleSubmit} className="space-y-4">
            {formError ? (
              <Alert
                title="Unable to save changes"
                description={formError}
                variant="error"
              />
            ) : null}
            {fields.map((field) => {
              const value = draft[field.name]

              if (field.type === 'boolean') {
                return (
                  <label
                    key={field.name}
                    className="flex items-center gap-3 rounded-[var(--radius-field)] border border-border bg-background px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          [field.name]: event.target.checked,
                        }))
                      }}
                    />
                    <div>
                      <span className="font-medium">{field.label}</span>
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                    </div>
                  </label>
                )
              }

              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`${title}-${field.name}`}>{field.label}</Label>
                  {field.type === 'textarea' || field.type === 'json' ? (
                    <Textarea
                      id={`${title}-${field.name}`}
                      rows={field.type === 'json' ? 8 : 4}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      id={`${title}-${field.name}`}
                      required={field.required}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }}
                    >
                      <option value="">Select one</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={`${title}-${field.name}`}
                      type={
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'url'
                            ? 'url'
                            : field.type === 'email'
                              ? 'email'
                          : 'text'
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                      value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                      onChange={(event) => {
                        const nextValue =
                          field.type === 'number'
                            ? Number(event.target.value)
                            : event.target.value
                        setDraft((current) => ({
                          ...current,
                          [field.name]: nextValue,
                        }))
                      }}
                    />
                  )}
                  {field.helperText ? (
                    <p className="text-xs text-muted-foreground">{field.helperText}</p>
                  ) : null}
                </div>
              )
            })}
          </form>
        </Dialog>
      </CardContent>
    </Card>
  )
}
