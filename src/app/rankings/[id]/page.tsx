"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RankingRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!params?.id) return;
    router.replace(`/rankings/${params.id}/edit`);
  }, [params?.id, router]);

  return null;
}
