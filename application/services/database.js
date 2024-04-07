const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL;

const connectToDatabase = async () => {
    const client = new MongoClient(uri);
    const db = client.db(process.env.DB_NAME || "application");
    return {
        db: db,
        client: client
    };
};

const getUsers = async () => {
    try {
        const { db, client } = await connectToDatabase();
        await client.connect();
        console.log("Connected to MongoDB")
        const users = await db.collection('users').find().toArray();
        client.close();
        return users;
    } catch(err) {
        console.error('Could not connect to MongoDB:', err);
        return [];
    }
};

const postUser = async (json) => {
    try {
        const { db, client } = await connectToDatabase();
        await client.connect();
        console.log("Connected to MongoDB")
        const userId = await db.collection('users').insertOne(json)
            .then(async (user) => {
                return user.insertedId;
            })
            .catch(async () => {
                return 0;
            });
        client.close();
        return userId;
    } catch(err) {
        console.error('Could not connect to MongoDB:', err);
        return false;
    }
};

module.exports = { getUsers, postUser };
