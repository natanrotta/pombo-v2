import { memo } from "react";
import { Box, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface DataTableColumn<RowData> {
  key: string;
  header: string;
  render: (row: RowData) => ReactNode;
}

interface DataTableProps<RowData extends { id: string }> {
  data: RowData[];
  columns: Array<DataTableColumn<RowData>>;
}

function DataTableInner<RowData extends { id: string }>({
  data,
  columns,
}: DataTableProps<RowData>) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      bg="bg.surface"
      overflow="hidden"
    >
      <TableContainer>
        <Table variant="simple" size="md" minW="600px">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  py={4}
                  color="text.secondary"
                  fontSize="xs"
                  letterSpacing="widest"
                >
                  {column.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row) => (
              <Tr key={row.id}>
                {columns.map((column) => (
                  <Td key={column.key} py={4}>
                    {column.render(row)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
