import mongoose from 'mongoose';
import { ENV } from './env.js';
export const connectDB = async () => {
    try {
        const mongoURI = ENV.DB_URL;
        if (!mongoURI) {
            throw new Error('MONGODB_URL is not defined in the environment variables');
        }
        await mongoose.connect(mongoURI);
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            process.exit(0);
        });
    }
    catch (error) {
        throw new Error(`Failed to connect to mongoDB: ${error}`);
    }
};
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
    }
    catch (error) { }
};
//# sourceMappingURL=db.js.map