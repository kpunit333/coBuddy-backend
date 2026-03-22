import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthTokens extends Document {
  userId: mongoose.Types.ObjectId;
  access_token: string;
  access_expires_at: Date;
  refresh_token?: string;
  refresh_expires_at?: Date;
}

const oAuthTokensSchema = new Schema<IOAuthTokens>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One per user
  },
  access_token: {
    type: String,
    required: true,
  },
  access_expires_at: {
    type: Date,
    required: true,
  },
  refresh_token: {
    type: String,
  },
  refresh_expires_at: {
    type: Date,
  },
}, {
  timestamps: true,
});

const OAuthTokens = mongoose.model<IOAuthTokens>('OAuthTokens', oAuthTokensSchema);

export default OAuthTokens;
