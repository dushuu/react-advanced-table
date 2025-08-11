import { DataTable } from "../components/DataTable";
import { useApi } from "../hooks/useApi";
// import type { ColumnDef } from "@tanstack/react-table";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export default function TablePage() {
  const { data, loading, error } = useApi<Post[]>("/posts");

//   const columns: ColumnDef<Post>[] = [
//     { accessorKey: "id", header: "ID" },
//     { accessorKey: "title", header: "Title" },
//     { accessorKey: "body", header: "Body" },
//   ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return null;

  return <DataTable />;
}
