import { redirect } from "next/navigation";

export default function NewArticlePage() {
  redirect("/feed?write=article");
}
