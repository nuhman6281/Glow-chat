import mongoose from 'mongoose';
import { dbConfig } from './config';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoURI = dbConfig.mongoUri;
    
    const options = {
      bufferCommands: false,
      maxPoolSize: dbConfig.dbPoolSize,
      serverSelectionTimeoutMS: dbConfig.dbTimeout,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(mongoURI, options);
    
    console.log('✅ Database connected successfully');
    
    // Set up event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ Database connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Database disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ Database reconnected');
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};
