import { NextResponse } from "next/server";
import { r2Diag } from "@/server/storage";
import { requireAdmin } from "@/server/auth";
import {
  allowedImageType,
  imageStorageConfigured,
  putImage,
} from "@/server/storage";

const MAX_BYTES = 3 * 1024 * 1024;

/** Admin only: upload a poster / backdrop image (the browser shrinks it first, so it is small). */
export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  if (!imageStorageConfigured())
    return NextResponse.json({ code: "NOT_CONFIGURED" }, { status: 503 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
  if (!allowedImageType(file.type))
    return NextResponse.json({ code: "BAD_TYPE" }, { status: 415 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ code: "TOO_BIG" }, { status: 413 });

  try {
    const url = await putImage(
      new Uint8Array(await file.arrayBuffer()),
      file.type,
    );
    return NextResponse.json({ url });
  } catch (e) {
    // Admin-only route: show the storage error name/message (never contains the keys) so setup problems are visible.
    const detail =
      e instanceof Error
        ? `${e.name}: ${e.message}`.slice(0, 200) + ` [${r2Diag()}]`
        : "unknown";
    return NextResponse.json(
      { code: "UPLOAD_FAILED", detail },
      { status: 502 },
    );
  }
}
