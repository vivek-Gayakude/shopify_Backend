const express = require('express');
const app = express();
const {User} = require('./model/User');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const {Product} = require('./model/product');


//connecting to database
mongoose.connect('mongodb://127.0.0.1:27017/shopify_com')
.then(()=>{
    console.log('Connected to database');
}).catch((err)=>{
    console.log('database is notConnected', err);
})


//middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'))


//task-1 -> create a register route
app.post('/register',async(req,res)=>{
    try{

        const {name,email,password} = req.body;
        //check is any  field missing
        if(!name || !email || !password){
            return res.status(400).json({message:'Some fields are Missing'});
        }

        //check if user already exists
        const isUserAlreadyExists = await User.findOne({email});
        if(isUserAlreadyExists){
            return res.status(400).json({message:'User already exists'})
        }else{

            //hashing the password
            const salt = await bcrypt.genSaltSync(10);
            const hashedPassword = await bcrypt.hashSync(password,salt);

            //jwt token
            const token = jwt.sign({email},'supersecret',{expiresIn:'365d'});

            //creating new user
            await User.create({
                name,
                email,
                password:hashedPassword,
                token,
                role:'user'
            })
            return res.status(201).json({message:'User created successfully'});
        }
        

    }catch(error){
        console.log(error);
        return res.status(500).json({message:'Internal server error'})
    }
})

//task-2 -> create a login route
app.post('/login',async(req,res)=>{
    try{
        const {email, password} = req.body;

        //check if any field is missing
        if(!email || !password){
            return res.status(400).json({message:'Some fields are missing'});
        }
    
        //user exists or not
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:'User does not exists.Please register first'});
        }

        //compare the entered password with the hashed password
        const isPasswordMatched = await bcrypt.compareSync(password,user.password);
        if(!isPasswordMatched){
            return res.status(400).json({message:"Password is incorrect"});
        }

        //succesfully logged in
        return res.status(200).json({
            message:'user logged in successfully',
            id:user._id,
            name:user.name,
            email:user.email,
            token:user.token,
            role:user.role
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({message:'Internal server error'})
    }
})

//task-3 -> create a route to add product
app.get('/products',async(req,res)=>{
    try{
        const products = await Product.find({});
        return res.status(200).json({message:'find all products',products:products}); 
    }catch(error){
        console.log(error);
        return res.status(500).json({message:'Internal server error'})
    }
})

//task-4 -> create a route to add product
app.post('/add-product',async(req,res)=>{
    try{
        const {name,price,brand,stock,image,description} = req.body;
        const{token} = req.headers;
        const decodedToken = jwt.verify(token,'supersecret');
        const user = await User.findOne({email:decodedToken.email});

        await Product.create({
            name,
            price,
            brand,
            stock,
            image,
            description,
            user:user._id
        });
        return res.status(201).json({message:'Product added successfully'});

    }catch(error){
        console.log(error);
        return res.status(500).json({message:'Internal server error'})
    }
})

//task-5 -> create a route to see the particular details
app.get('/product/:id',async(req,res)=>{
    try{
        const {id} = req.params;
        if(!id){
            return res.status(400).json({message:'Product id is missing'});
        }
        const token = req.headers.token;
        const userEmailFromToken = jwt.verify(token,'supersecret');
        if(!userEmailFromToken.email){
            const product = await Product.findById(id);

            if(!product){
                return res.status(400).json({message:'Product not found'});
            }
            return res.status(200).json({message:'success',product});
          
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({message:'Internal server error'})
    }
})

//task-6 -> create a route to update the product
app.patch("/product/edit/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.headers;
    const body = req.body.productData;
    const name = body.name;
    const description = body.description;
    const image = body.image;
    const price = body.price;
    const brand = body.brand;
    const stock = body.stock;
    const userEmail = jwt.verify(token, "supersecret");
    try {
      console.log({
        name,
        description,
        image,
        price,
        brand,
        stock,
      });
      if (userEmail.email) {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
          name,
          description,
          image,
          price,
          brand,
          stock,
        });
        res.status(200).json({ message: "Product Updated Succesfully" });
      }
    } catch (error) {
      res.status(400).json({
        message: "Internal Server Error Occured While Updating Product",
      });
    }
  });

// task 6 -> create a route to delete the product
app.patch("/product/edit/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.headers;
    const body = req.body.productData;
    const name = body.name;
    const description = body.description;
    const image = body.image;
    const price = body.price;
    const brand = body.brand;
    const stock = body.stock;
    const userEmail = jwt.verify(token, "supersecret");
    try {
      console.log({
        name,
        description,
        image,
        price,
        brand,
        stock,
      });
      if (userEmail.email) {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
          name,
          description,
          image,
          price,
          brand,
          stock,
        });
        res.status(200).json({ message: "Product Updated Succesfully" });
      }
    } catch (error) {
      res.status(400).json({
        message: "Internal Server Error Occured While Updating Product",
      });
    }
  });

//task-7 -> create a route to delete the product
app.delete('/product/delete/:id',async(req,res)=>{
    const {id} = req.params;
    if(!id){
        return res.status(400).json({message:"product id not found"})

    }
    try{
        const deleteProduct = await Product.findByIdAndDelete(id);
        if(!deleteProduct){
            res.status(404).json({message:"product not found"});
        }

        res.status(200).json({message:"product deleted successfully",
            product:deleteProduct
        })

    }catch (error) {
      res.status(400).json({
        message: "Internal Server Error Occured While Updating Product",
      });
    }

  })

//   task-8 -> search product
app.get('/product/search/:keyword',async(req,res)=>{
    const {keyword} = req.params;
    try{
        const products = await Product.find({
            name:{$regex: keyword, $options:"i"}
        });
        if(products.length === 0){
            return res.status(404).json({message:"No Product Found"});
        }

        return res.status(200).json({
            message:"Product found",
            products:products
        })

    }catch (error) {
        res.status(400).json({
          message: "Internal Server Error Occured While Updating Product",
        });
      }
})


const PORT = 8080;
app.listen(PORT,()=>{
    console.log(`Server is connected to port ${PORT}`);
})