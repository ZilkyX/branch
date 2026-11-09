import { updateApplicationSchema } from "@/lib/application-schema";
import { deleteApplication, updateApplication } from "@/lib/applications-repository";

import { errorResponse, readJson, withUser } from "../_helpers";

type Context = { params: Promise<{ id: string }> };

export function PATCH(request: Request, { params }: Context) {
  return withUser(async (userId) => {
    const patch = updateApplicationSchema.safeParse(await readJson(request));
    if (!patch.success) return errorResponse(400, "That update isn't valid.");

    const { id } = await params;
    const application = await updateApplication(userId, id, patch.data);
    return application ? Response.json(application) : errorResponse(404, "Application not found.");
  });
}

export function DELETE(_request: Request, { params }: Context) {
  return withUser(async (userId) => {
    const { id } = await params;
    const deleted = await deleteApplication(userId, id);
    return deleted ? new Response(null, { status: 204 }) : errorResponse(404, "Application not found.");
  });
}
