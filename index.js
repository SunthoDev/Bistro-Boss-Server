require('dotenv').config()
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
const app = express()
const port = process.env.PORT || 5000




// middleware
app.use(cors())
app.use(express.json())


// JWT Verify token Access

let verifyJwt = (req, res, next) => {

  let authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).send({ error: true, message: " Unauthorize Access " })
  };
  // bearer token access 
  let token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {

      return res.status(401).send({ error: true, message: " Unauthorize Access " })
    }
    req.decoded = decoded;
    next()
  });


}



// mongodb code use

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.qzzmb4j.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // ===============================================

    // database collection names 
    const menuCollection = client.db("bistroDb").collection("menu")
    const reviewCollection = client.db("bistroDb").collection("review")
    const cartCollection = client.db("bistroDb").collection("carts")
    const userCollection = client.db("bistroDb").collection("user")
    const paymentCollection = client.db("bistroDb").collection("payment")
    const contactCollection = client.db("bistroDb").collection("contact")

    /**
     * use jwt token verify user
     * karon user login allUser data dhaka palva..sata sude admin dhakva 
     * ..sayjano sataka server and client site thaka sequre kore hoicha  
     * 
     * do not secure links to those who sould not see the links 
     * 
     * 
     * 
     * 
     * 
     *  
    */

    // Json web token use 
    // =======================================================

    app.post("/jwt", (req, res) => {
      let email = req.body
      let token = jwt.sign(email, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
      })
      res.send({ token })
    })


    // verify admin check login,,,for provide admin data

    const verifyAdmin = async (req, res, next) => {

      const email = req.decoded.email
      let query = { email: email }
      let user = await userCollection.findOne(query)
      if (user?.role !== "admin") {
        return res.status(403).send({ error: true, message: " Forbidden Message " })
      }
      next()
    }
    // =======================================================================

    // menu all data get database 
    app.get("/menus", async (req, res) => {
      let result = await menuCollection.find().toArray()
      res.send(result)
    })

    // add item menu collection admin 
    app.post("/menus", async (req, res) => {
      let items = req.body
      let result = await menuCollection.insertOne(items)
      res.send(result)
    })

    //  menu deleted admin 
    app.delete("/menus/:id", async (req, res) => {
      let id = req.params.id
      console.log(id)

      let query = { _id: new ObjectId(id) }
      let result = await menuCollection.deleteOne(query)
      res.send(result)

    })

    // =======================================================

    // review all data get database 
    app.get("/review", async (req, res) => {
      let result = await reviewCollection.find().toArray()
      res.send(result)
    })

    // ======================================================


    // add cart data mongoDB 
    app.post("/addCard", async (req, res) => {
      let cartItem = req.body
      let result = await cartCollection.insertOne(cartItem)
      res.send(result)
    })

    // get user email cart data.. use query get data ...| tenStack query use ...
    app.get("/addCard", verifyJwt, async (req, res) => {
      let email = req.query.email
      if (!email) {
        res.send([])
      }
      let decodedEmail = req.decoded.email
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: "forbidden Access" })
      }
      let query = { email: email }
      let result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    // delete user data for database delete one 
    app.delete("/addCard/:id", async (req, res) => {
      let id = req.params.id
      let query = { _id: new ObjectId(id) }
      let result = await cartCollection.deleteOne(query)
      res.send(result)
    })


    // =====================================================================

    // all user get admin see

    app.get("/users", verifyJwt, verifyAdmin, async (req, res) => {

      let result = await userCollection.find().toArray()
      res.send(result)
    })


    // user data collect hova hova
    // google login jano unik user info add DB ,,jode aga user are info thaka tahola add hova nah...

    app.post("/users", async (req, res) => {
      let users = req.body

      let query = { email: users.email }
      let existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: "Already existing user" })
      }

      let result = await userCollection.insertOne(users)
      res.send(result)
    })


    // check user admin ke nah _________________________________________

    app.get("/userAdmin/:email", verifyJwt, async (req, res) => {
      let email = req.params.email

      // check jwt
      if (req.decoded.email !== email) {
        return res.send({ admin: false })
      }
      // check admin ke nah 
      let query = { email: email }
      let user = await userCollection.findOne(query)
      let result = { admin: user?.role === "admin" }
      res.send(result)

    })

    // User Update to admin
    app.patch("/users/admin/:id", async (req, res) => {

      let id = req.params.id
      let filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $set: {
          role: "admin"
        },
      };

      let result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)

    })

    // user delete to admin 
    app.delete("/usersDelete/:id", async (req, res) => {
      let id = req.params.id
      let query = { _id: new ObjectId(id) }
      let result = await userCollection.deleteOne(query)
      res.send(result)
    })

    // https://demoapus1.com/freeio/
    // https://preview.themeforest.net/item/faimos-influencer-marketing-marketplace-theme/full_screen_preview/45942439?_ga=2.46898919.1755742165.1686749757-2130048215.1668433515&_gac=1.16453188.1684523575.CjwKCAjwvJyjBhApEiwAWz2nLQq0BiimZVXPuh2rzVCseg4HHAQ_43AKYGfZjBAXDpNWEYabMw8E0hoC_KUQAvD_BwE

    // =======================================================
    // payment method use

    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    // payment history save database 
    app.post("/payment", async (req, res) => {
      let payment = req.body
      let result = await paymentCollection.insertOne(payment)

      let query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
      let deleteResult = await cartCollection.deleteMany(query)
      res.send({ result, deleteResult })
    })

    // payment history part 
    app.get("/paymentHistory", async (req, res) => {

      let query = {}
      if (req.query.email) {
        query = { email: req.query.email }
      }
      let result = await paymentCollection.find(query).toArray()
      res.send(result)
    })

    // =============================================================================================
    // admin home work 
    // ---------------------------------------------------------------------------------------------

    // admin home info include 
    app.get("/admin-status", async (req, res) => {

      let user = await userCollection.estimatedDocumentCount()
      let product = await menuCollection.estimatedDocumentCount()
      let orders = await paymentCollection.estimatedDocumentCount()
      let payment = await paymentCollection.find().toArray()
      let revenue = payment.reduce((sum, payment) => sum + payment.price, 0)

      res.send({ user, product, orders, revenue })
    })

    // User home info include 
    app.get("/user-status", async (req, res) => {

      let query = {}
      if (req.query.email) {
        query = { email: req.query.email }
      }

      let product = await menuCollection.estimatedDocumentCount()
      let payment = await paymentCollection.find(query).toArray()
      let cart = await cartCollection.find(query).toArray()
      let review = await reviewCollection.find(query).toArray()

      res.send({ payment, product, cart, review })
    })




    // ================================================

    // user review part add 
    app.post("/addReview", async (req, res) => {
      let review = req.body
      let result = await reviewCollection.insertOne(review)
      res.send(result)
    })

    // ================================================
    // Contact Route Work
    // -------------------------------

    // user Contact add 
    app.post("/addContact", async (req, res) => {
      let contact = req.body
      let result = await contactCollection.insertOne(contact)
      res.send(result)
    })






















    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




// test server 
app.get("/", (req, res) => {
  res.send("Finea Project server is running")
})
// port Connect
app.listen(port, () => {
  console.log(`Project server is running ${port}`)
})