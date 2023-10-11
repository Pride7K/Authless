import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }
    console.log(MONGODB_URI)
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB')
      return mongoose
    }).catch(console.log)
  }

  try {
    console.log("lol1")
    cached.conn = await cached.promise
    console.log("lol2")
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default dbConnect