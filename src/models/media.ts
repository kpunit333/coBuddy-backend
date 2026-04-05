import mongoose from "mongoose";

export interface IMedia extends Document {
  name: string;
  img: {
    data: Buffer;
    contentType: string;
  };
} 

const mediaSchema = new mongoose.Schema({
  name: String,
  img: {
    data: Buffer,
    contentType: String
  }
});

const Media = mongoose.model<IMedia>('Media', mediaSchema);

export default Media;