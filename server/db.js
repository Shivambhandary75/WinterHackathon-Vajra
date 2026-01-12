const mongoose = require('mongoose');

module.exports.connectdb = () => {
    mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB connected');
})
.catch((err) => {
  console.log('MongoDB connection error:', err);
  process.exit(1);
});
}