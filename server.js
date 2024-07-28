const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const User = require('./models/User');
const Group = require('./models/Group');
const fs = require('fs');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const stream = require('stream');
 // Adjust the path as necessary
 const cors = require('cors');
 
   

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(cors());
const PORT = process.env.PORT || 4000;
const MONGODB_URI = 'mongodb+srv://himanshuu932:88087408601@cluster0.lu2g8bw.mongodb.net/chatApp?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', (err) => console.log(err));
db.once('open', () => {startServer(); console.log("Connected to MongoDB")});

// User registration
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
      
        if (user) {
            return res.status(401).json({success: false, msg: 'User already exists' });
        }

        user = new User({ name, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.status(200).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
app.get('/messages/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        
        // Find the group by its ID
        const groupChat = await Group.findById(groupId);
       
        if (groupChat) {
            res.json(groupChat.messages);
        } else {
            res.status(404).send('No messages found for this group');
        }
    } catch (err) {
       
        res.status(500).send('Error fetching messages');
    }
});

app.post('/message', async (req, res) => {
    const { groupId, userName, text, timestamp } = req.body;

    try {
        // Find the group chat and push the new message
        const groupChat = await Group.findOneAndUpdate(
            { _id: groupId }, // Find the group by its ID
            { $push: { messages: { timestamp, userName, text } } }, // Push new message to messages array
            { new: true, upsert: true } // Return the updated document, create if it doesn't exist
        );
        res.status(201).json(groupChat); // Return the updated groupChat document
    } catch (err) {
        console.log(err);
        res.status(500).send('Error saving message');
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
       
        if (!user) {
            return res.status(401).json({ success: false, msg: 'Invalid email' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(402).json({ success: false, msg: 'Invalid password' });
        }

        // Send user ID along with name and success message
        res.json({
            success: true,
            id: user._id,       // Include user ID
            name: user.name,
            message: 'User authenticated successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Serve the HTML files
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "groups", "index.html")));
app.get("/chat.html", (req, res) => res.sendFile(path.join(__dirname, "groups", "chat.html")));
app.get("/info.html", (req, res) => res.sendFile(path.join(__dirname, "groups", "info.html")));
app.get("/groups.html", (req, res) => res.sendFile(path.join(__dirname, "groups", "groups.html")));
app.get("/infoscript.js", (req, res) => res.sendFile(path.join(__dirname, "groups", "infoscript.js")));
app.get("/js.js", (req, res) => res.sendFile(path.join(__dirname, "groups", "js.js")));
app.get("/chat.js", (req, res) => res.sendFile(path.join(__dirname, "groups", "chat.js")));
app.get("/lg.js", (req, res) => res.sendFile(path.join(__dirname, "public", "lg.js")));
app.get("/groups/notification.wav ", (req, res) => res.sendFile(path.join(__dirname, "public", "notification.wav ")));


const Image = require('./models/Image.js');


// Group management

app.post('/groups', async (req, res) => {
    const { name, userId, password } = req.body;

    try {
        // Check if the group name already exists
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) {
            return res.status(400).json({ error: 'Group name already exists. Please choose a different name.' });
        }

        // Verify if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Create the new group
        const group = new Group({
            name,
            admin: [userId],
            members: [userId],
            password,
            imageId: "66a53230fbc60a6e879983d2", // Initialize imageId to null if not provided
            messages: [] // Initialize messages as an empty array
        });

        await group.save();
        res.status(201).json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



app.get('/groups', async (req, res) => {
    const groups = await Group.find({});
    
    res.json(groups);

});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'groups', 'chat.html'));
});
app.delete('/groups/:id/:userId', async (req, res) => {
    const { id, userId } = req.params;

    try {
        // Find the group by ID
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        // Check if the user is in the admin array
        if (!group.admin.includes(userId)) {
            return res.status(403).json({success:false, error: 'Only an admin can delete the group.' });
        }

        // Delete the group
        await Group.findByIdAndDelete(id);
        res.status(204).json({success:true});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Endpoint to get group name by ID
app.get('/group/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Find the group by ID
        const group = await Group.findById(id);
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Fetch usernames for each member ID
        // Respond with group name and member usernames
        res.json({
            name: group.name,
            members: group.members,
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/getusername/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Validate ID format
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, msg: 'Valid ID is required' });
        }

        // Find the user by ID
        const user = await User.findById(id);
        
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

       
        
        // Send the response
        res.json({
            success: true,
            username: user.name
        });
    } catch (err) {
        console.error('Error in /getusername/:id:', err);
        res.status(500).send('Server error');
    }
});

app.get('/get-all-usernames', async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find({}, 'name _id'); // Fetch both 'name' and '_id' fields

        // Check if there are users in the database
        if (users.length === 0) {
            return res.status(404).json({ success: false, msg: 'No users found' });
        }

        // Prepare an array of objects containing both username and _id
        const userArray = users.map(user => ({
            id: user._id,
            name: user.name
        }));

        // Respond with the list of usernames and ids
        res.json({
            success: true,
            users: userArray
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
app.get('/is-admin/:groupId/:userId', async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Find the group by groupId
        const group = await Group.findById(groupId).exec();

        if (group) {
            // Check if the userId is in the admin list
            const isAdmin = group.admin.includes(userId);

            return res.json({ isAdmin });
        } else {
            // Group not found
            return res.status(404).json({ error: 'Group not found' });
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.post('/remove-user-from-group', async (req, res) => {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
        return res.status(400).json({ success: false, msg: 'Group ID and User ID are required' });
    }

    try {
        // Find the group by ID
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ success: false, msg: 'Group not found' });
        }

        // Check if the user is in the group
        if (!group.members.includes(userId)) {
            return res.status(400).json({ success: false, msg: 'User is not a member of this group' });
        }

        // Remove the user from the group
        group.members = group.members.filter(member => member !== userId);
        await group.save();

        res.json({ success: true, msg: 'User removed from group successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/add-user-to-group', async (req, res) => {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
        return res.status(400).json({ success: false, msg: 'Group ID and User ID are required' });
    }

    try {
        // Find the group by ID
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ success: false, msg: 'Group not found' });
        }

        // Check if the user is already in the group
        if (group.members.includes(userId)) {
            return res.status(400).json({ success: false, msg: 'User is already a member of this group' });
        }

        // Add the user to the group
        group.members.push(userId);
        await group.save();

        res.json({ success: true, msg: 'User added to group successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
app.post('/group/:id/image', async (req, res) => {
    const { id } = req.params;
    const { imageId } = req.body;
    
    try {
        const updatedGroup = await Group.updateImageId(id, imageId);
        if (updatedGroup) {
            res.status(200).json({ success: true, group: updatedGroup });
        } else {
            res.status(404).json({ success: false, message: 'Group not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete image by ID route

  
app.get('/get-group-image/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;

        // Validate the groupId
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }

        // Find the group by ID
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Respond with the imageId
        res.status(200).json({ imageId: group.imageId });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});


app.get('/chat-file/:groupId', (req, res) => {
    const groupId = req.params.groupId;
    const chatFilePath = path.join(__dirname, 'chats', `${groupId}.txt`);

    fs.readFile(chatFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading chat file');
            return;
        }
        res.send(data);
    });
});

// Serve socket.io.js file directly
app.get("/socket.io/socket.io.js", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules", "socket.io", "client-dist", "socket.io.js"));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    // Variable to store group membership
    let currentGroupName = '';
    let currentUserName = '';
    socket.on('audio message', (data) => {
        const { groupId, audioUrl, userName } = data;
        io.to(groupId).emit('audio message', { audioUrl, userName });
    });
    // Handle join group
    socket.on('join group', (groupName, userName) => {
        currentGroupName = groupName;
        currentUserName = userName;

        socket.join(groupName);
        io.to(groupName).emit('user joined', userName);

        socket.on('chat message', (data) => {
            const { groupId, message } = data;
            const formattedMessage = `${message.timestamp} - ${message.userName} - ${message.text}\n`;
    
            // Save the message to a file
            fs.appendFile(path.join(__dirname, 'chats', `${groupId}.txt`), formattedMessage, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                }
            });
    
            io.to(groupId).emit('chat message', data);
        });

        // Handle user leaving explicitly
        socket.on('user left', (userName) => {
            if (userName && currentGroupName) {
                io.to(currentGroupName).emit('user left', userName);
            }
        });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
        // No 'user left' event emitted here
    });

    // Handle new user
    socket.on('new user', (userName) => {
        if (userName) {
            io.emit('new user', userName);
        }
    });
});

function startServer() {
    // Ensure the GridFSBucket is initialized only after the connection is established
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'images' });
  
    // Multer setup
    const storage = multer.memoryStorage();
    const upload = multer({ storage });
  
    // Upload image route
    app.post('/upload', upload.single('image'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      console.log('Received file:', req.file.originalname);
  
      const uploadStream = bucket.openUploadStream(req.file.originalname);
      const readableStream = new stream.PassThrough();
      readableStream.end(req.file.buffer);
      readableStream.pipe(uploadStream);
  
      uploadStream.on('finish', () => {
        console.log('Upload finished:', uploadStream.id);
        res.json({ fileId: uploadStream.id, filename: req.file.originalname });
      });
  
      uploadStream.on('error', (err) => {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
      });
    });
  
    // Fetch all images route
    app.get('/images', async (req, res) => {
      try {
        const files = await bucket.find().toArray();
        const imageFiles = files.map(file => ({
          filename: file.filename,
          id: file._id
        }));
        res.json(imageFiles);
      } catch (err) {
        console.error('Error fetching images:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  
    // Fetch image by filename route
    app.get('/images/:filename', (req, res) => {
      const filename = req.params.filename;
      const downloadStream = bucket.openDownloadStreamByName(filename);
  
      downloadStream.on('data', (chunk) => {
          res.write(chunk);
      });
  
      downloadStream.on('end', () => {
          res.end();
      });
  
      downloadStream.on('error', (err) => {
          console.error('Download error:', err);
          res.status(404).json({ error: 'File not found' });
      });
    });
    app.delete('/images/id/:id', async (req, res) => {
        const id = req.params.id;
      
        // Validate if the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid ID format' });
        }
      
        try {
          await bucket.delete(new mongoose.Types.ObjectId(id));
          res.status(200).json({ message: 'File deleted successfully' });
        } catch (err) {
          if (err.code === 'ENOENT') {
            // Handle the case where the file is not found
            res.status(404).json({ error: 'File not found' });
          } else {
            // Handle other errors
            console.error('Delete error:', err);
            res.status(500).json({ error: 'Internal server error' });
          }
        }
      });
    // Fetch image by ID route
    app.get('/images/id/:id', (req, res) => {
      const id = new mongoose.Types.ObjectId(req.params.id);
      const downloadStream = bucket.openDownloadStream(id);
  
      downloadStream.on('data', (chunk) => {
          res.write(chunk);
      });
  
      downloadStream.on('end', () => {
          res.end();
      });
  
      downloadStream.on('error', (err) => {
          console.error('Download error:', err);
          res.status(404).json({ error: 'File not found' });
      });
    });
    
  }

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});


