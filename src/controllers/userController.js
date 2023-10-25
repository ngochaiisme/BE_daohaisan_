const { auto_create_id_user } = require('../config/generateId')
const Product = require('../models/Product')
const User = require('../models/User')

const getAllUser = (req, res) => {
    User.find()
        .then((users) => {
            res.status(200).json({
                message: 'Fetched Successfully!',
                data: {
                    users: users,
                },
            })
        })
        .catch((err) => res.status(500).json({ err: err }))
}

const getAllCustomer = (req, res) => {
    User.find({ isAdmin: false })
        .then((users) => {
            res.status(200).json({
                message: 'Fetched Successfully!',
                data: {
                    customers: users,
                },
            })
        })
        .catch((err) => res.status(500).json({ err: err }))
}

const createUser = async (req, res, next) => {
    const { fullname, email, password, phone, avatarUrl, gender, address } = req.body
    const id = await auto_create_id_user()
    const user = new User({
        id,
        fullname,
        email,
        password,
        phone,
        avatarUrl,
        gender,
        address,
    })

    user.save()
        .then((user) => {
            res.status(200).json({ message: 'Create Successfully', data: { newUser: user } })
        })
        .catch((err) => res.status(500).json({ message: 'Có lỗi xảy ra', err: err }))
}

//get an User

const getUser = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findOne({ id: userId })
        if (!user) return res.status(404).json({ message: 'User not fount' })
        res.status(200).json({ message: 'Successfully', data: { userInfo: user } })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Có lỗi xảy ra', err: err })
    }
}

const updateUser = async (req, res) => {
    try {
        const { userId, fullname, email, password, phone, avatarUrl, gender, address } = req.body
        const user = await User.findOne({ id: userId })
        if (!user) return res.status(404).json({ message: 'User not fount' })
        user.fullname = fullname
        user.email = email
        user.password = password
        user.phone = phone
        user.avatarUrl = avatarUrl
        user.gender = gender
        user.address = address
        const newUser = await user.save()
        res.status(200).json({
            message: 'Cập nhập sản phẩm thành công',
            data: { newUser: newUser },
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Có lỗi xảy ra', err: err })
    }
}

// const getCart = async (req, res) => {
//     try {
//         const userId = req.params.id
//         const user = await User.findOne({ id: userId }).populate({
//             path: 'cart.items.productId',
//             model: 'Product', // Thay 'Product' bằng tên model sản phẩm của bạn
//         })

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' })
//         }

//         const cart = user.cart.items
//         res.status(200).json({ cart })
//     } catch (err) {
//         console.log(err)
//         res.status(500).json({ message: 'Có lỗi xảy ra', err: err })
//     }
// }

const getCart = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findOne({ id: userId })

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const cartItems = user.cart.items

        // Lấy thông tin sản phẩm cho mỗi sản phẩm trong giỏ hàng
        const cart = []

        for (const cartItem of cartItems) {
            const product = await Product.findOne({ id: cartItem.productId })

            if (product) {
                cart.push({
                    product,
                    quantity: cartItem.quantity,
                })
            }
        }

        res.status(200).json({ cart })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Có lỗi xảy ra', err: err })
    }
}

const addProductToCart = async (req, res) => {
    try {
        const { userId, productId } = req.body

        const user = await User.findOne({ id: userId })
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        const product = await Product.findOne({ id: productId })
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        const cartItem = user.cart.items.find((item) => item.productId === productId)
        if (cartItem) {
            cartItem.quantity += 1
        } else {
            user.cart.items.push({
                productId: productId,
                quantity: 1,
            })
        }

        await user.save()
        res.status(200).json({
            message: 'Giỏ hàng đã được cập nhập',
            data: {
                cart: user.cart,
            },
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Có lỗi xảy ra', error: err })
    }
}
const removeProductFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body
        const user = await User.findOne({ id: userId })
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        const cartItem = user.cart.items.find((item) => item.productId === productId)
        if (!cartItem) {
            return res.status(404).json({ message: 'Product not found in your cart' })
        }
        user.cart.items = user.cart.items.filter((item) => item.productId !== productId)
        await user.save()
        res.status(200).json({
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            data: { newCart: user.cart },
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Có lỗi xảy ra', error: err })
    }
}

module.exports = {
    createUser,
    getAllUser,
    addProductToCart,
    getUser,
    updateUser,
    removeProductFromCart,
    getCart,
    getAllCustomer,
}
