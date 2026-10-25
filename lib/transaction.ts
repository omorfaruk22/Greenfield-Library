import mongoose, { type ClientSession } from 'mongoose';

export async function withMongoTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let value!: T;
    await session.withTransaction(async () => {
      value = await work(session);
    });
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/Transaction numbers are only allowed|replica set|does not support transactions|transactions are not supported/i.test(message)) {
      throw new Error('This operation requires a MongoDB Atlas cluster or a transaction-capable replica set. Configure a transaction-capable MongoDB deployment and try again.');
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
