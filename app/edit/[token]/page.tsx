import { EditPage } from "./EditPage";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <EditPage token={token} />;
}
