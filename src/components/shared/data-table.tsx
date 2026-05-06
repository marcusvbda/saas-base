import type { LucideIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from './empty-state'

interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyIcon: LucideIcon
  emptyTitleKey: string
  emptyDescriptionKey: string
}

export function DataTable<T>({
  columns,
  data,
  emptyIcon,
  emptyTitleKey,
  emptyDescriptionKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        titleKey={emptyTitleKey}
        descriptionKey={emptyDescriptionKey}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <td key={col.key} className={`p-4 align-middle ${col.className ?? ''}`}>
                  {col.cell(row)}
                </td>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
