const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email:      { type: String, default: '' },
  name:       { type: String, default: '' },
  role:       { type: String, default: '' },
  team_size:  { type: String, default: '' },
  location:   { type: String, default: '' },
  phone:      { type: String, default: '' },
  pain_point: { type: String, default: '' },
  persona:    { type: String, default: 'Unknown' },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Lead', leadSchema);
