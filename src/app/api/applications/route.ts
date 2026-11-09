import { createApplicationSchema } from "@/lib/application-schema";
import { createApplication, listApplications } from "@/lib/applications-repository";

import { errorResponse, readJson, withUser } from "./_helpers";

export function GET() {
  return withUser(async (userId) => Response.json(await listApplications(userId)));
}

export function POST(request: Request) {
  return withUser(async (userId) => {
    const input = createApplicationSchema.safeParse(await readJson(request));
    if (!input.success) return errorResponse(400, "That application isn't valid.");

    return Response.json(await createApplication(userId, input.data), { status: 201 });
  });
}
