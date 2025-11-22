import { db } from "../config/firebase.config.js";


const collection = db.collection("HABITACIONES");

export const create = async (data) => {
  const docRef = await collection.add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return { id: docRef.id, ...data };
};

export const getAll = async () => {
  const snapshot = await collection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getById = async (id) => {
  const doc = await collection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const update = async (id, data) => {
  await collection.doc(id).update({
    ...data,
    updatedAt: new Date()
  });
  return { id, ...data };
};

export const remove = async (id) => {
  await collection.doc(id).delete();
};
