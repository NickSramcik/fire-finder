import mongoose from 'mongoose';

export default async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(useRuntimeConfig().MONGODB_URI);
};
