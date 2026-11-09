import "server-only";

import { ObjectId } from "mongodb";

import type { Application } from "@/app/app/_tracker/applications";

import type { CreateApplicationInput, UpdateApplicationInput } from "./application-schema";
import { getDatabase } from "./mongodb";

// The only module that touches this collection. Every function requires the owner's
// user id and scopes its query to it, because MongoDB has no row-level security.

type ApplicationDocument = Omit<Application, "id"> & {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

let indexesReady: Promise<unknown> | undefined;

async function getCollection() {
  const database = await getDatabase();
  const collection = database.collection<ApplicationDocument>("applications");
  indexesReady ??= collection.createIndex({ userId: 1, appliedOn: -1 }).catch((error) => {
    indexesReady = undefined;
    throw error;
  });
  await indexesReady;
  return collection;
}

function toApplication(document: ApplicationDocument & { _id: ObjectId }): Application {
  const { _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...fields } = document;
  void _userId;
  void _createdAt;
  void _updatedAt;
  return { id: _id.toHexString(), ...fields };
}

// A malformed id can't match anything, so it's treated the same as not found.
function parseId(id: string) {
  return /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null;
}

export async function listApplications(userId: string) {
  const collection = await getCollection();
  const documents = await collection.find({ userId }).sort({ appliedOn: -1, _id: -1 }).toArray();
  return documents.map(toApplication);
}

export async function createApplication(userId: string, input: CreateApplicationInput) {
  const collection = await getCollection();
  const now = new Date();
  const document: ApplicationDocument = { ...input, userId, createdAt: now, updatedAt: now };
  const { insertedId } = await collection.insertOne(document);
  return toApplication({ ...document, _id: insertedId });
}

export async function updateApplication(
  userId: string,
  id: string,
  patch: UpdateApplicationInput,
) {
  const _id = parseId(id);
  if (!_id) return null;

  const collection = await getCollection();
  const document = await collection.findOneAndUpdate(
    { _id, userId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return document ? toApplication(document) : null;
}

export async function deleteApplication(userId: string, id: string) {
  const _id = parseId(id);
  if (!_id) return false;

  const collection = await getCollection();
  const { deletedCount } = await collection.deleteOne({ _id, userId });
  return deletedCount === 1;
}
