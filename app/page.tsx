import { auth } from "@/lib/auth/server";
import { MotionTable } from "@/components/MotionTable";

export default async function Home() {
  const { data: session } = await auth.getSession();
  const readOnly = !session?.user;
  return <MotionTable readOnly={readOnly} />;
}
