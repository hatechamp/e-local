//vrde.club

// Initialize Firebase
var config = {
    apiKey: "AIzaSyCwgdBtHXEyUVLe9yP_la8IrN0qG2SYeFM",
    authDomain: "vrde-admin.firebaseapp.com",
    databaseURL: "https://vrde-admin.firebaseio.com",
    projectId: "vrde-admin",
    storageBucket: "",
    messagingSenderId: "549162612019",
    appId: "1:549162612019:web:8eaa67dae5a1304c43fa46"
};

firebase.initializeApp(config);

var database = firebase.database();
const productsRef = database.ref('products');

var app = new Vue({
    el: '#app',
    data: {
        search: '',
        price: 50,
        discounts: '',
        productList: [],
        cartTotal: 0,
        cart: [],
        cartItems: 0,
        saleComplete: false,
        fieldsMissing: false,
        confirmModal: false,
        userData: {
            name: '',
            address: '',
            phone: '',
            email: '',
            delivery: false
        },
        active: {
            'verdura': { status: true },
            'fruta': { status: false },
            'almacen': { status: false }
        },
        cartHas: {
            verdura: false,
            fruta: false,
            almacen: false
        }
    },
    mixins: [Vue2Filters.mixin],
    created: function () {
        productsRef.on('value', snap => {
            let products = [];
            snap.forEach(item => {
                products.push({
                    active: item.child('active').val(),
                    name: item.child('name').val(),
                    type: item.child('type').val(),
                    price: item.child('price').val(),
                    image: item.child('image').val(),
                    amount: 0
                }
                );
            });
            this.setProducts(products);
        });
    },
    methods: {
        setProducts: function (products) {
            this.productList = products;
        },
        getTotal: function () {
            var self = this;
            this.cartTotal = 0;
            this.cartItems = 0;

            this.cart = this.productList.filter(function (item) {
                return item.total > 0;
            });

            for (var item in this.cart) {

                if (this.cart[item].type == 'fruta') {
                    this.cartHas.fruta = true;
                }
                if (this.cart[item].type == 'verdura') {
                    this.cartHas.verdura = true;
                }
                if (this.cart[item].type == "almacen") {
                    this.cartHas.almacen = true;
                }

                this.cart[item].total = this.cart[item].amount * this.cart[item].price;
                this.cart[item].total = parseFloat(this.cart[item].total.toFixed(2))

                this.cartTotal += this.cart[item].total;
                this.cartTotal = parseFloat(this.cartTotal.toFixed(2))
            }
        },
        addItem: function (item) {
            item.amount++;
            item.total = item.amount * item.price;
            this.getTotal();
        },
        removeItem: function (item) {
            this.getTotal();
            if (item.amount > 0) {
                item.amount--;
            }
            item.total = item.amount * item.price;
            this.getTotal();
        },
        updateValue: function (item) {
            if (item.amount == '' || parseFloat(item.amount) == NaN) { item.amount = 0 }
            else (item.amount = parseFloat(item.amount))
            item.total = item.amount * item.price;
            this.getTotal();
        },
        formValidate() {
            // form validation
            if (this.userData.name == '' || this.userData.phone == '') {
                this.fieldsMissing = true;
            }
            else if (this.userData.delivery == true && this.userData.address == '') {
                this.fieldsMissing = true;
            }
            else {
                this.fieldsMissing = false;
            }
            this.confirmModal = true;
        },
        saveSale: function (cart) {
            // send to firebase
            var today = new Date().toLocaleDateString('es-GB', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            }).split('/').join('-');

            var sale = [{
                date: today,
                name: this.userData.name,
                address: this.userData.address,
                phone: this.userData.phone,
                email: this.userData.email,
                delivery: this.userData.delivery,
                total: this.cartTotal,
                items: []
            }];

            for (var item in cart) {
                if (item.price === 0) {
                    item.price = this.price;
                }
                sale[0].items.push({
                    variedad: cart[item].name,
                    cantidad: cart[item].amount,
                    precio: cart[item].price,
                    pago: cart[item].total
                })
            }

            var self = this;
            database.ref('sales/').push(sale, function (error) {
                if (error) {
                    console.log(error)
                } else {
                    self.saleComplete = true;
                }
            });
            
            database.ref('salesArchive/').push(sale, function (error) {
                if (error) {
                    console.log(error)
                } else {
                    self.saleComplete = true;
                }
            });
        },

        //toggle category buttons
        setVisibility: function (type) {
            let p = document.getElementById("products");
            scrollTo({top: p.offsetTop - 55, behavior:"smooth" });
            this.search = '';
            for (var t in this.active) {
                this.active[t].status = false;
            }
            this.active[type].status = true;
        },
        toggleActive: function (e) {
            e.target.classList.add('active');
        },
        scrollTop: function () {
            window.scrollTo(0, 0);
        }
    },
    computed: {

        // returns filtered list by search term or category
        filteredItems: function () {
            var self = this;
            var newList = this.productList.sort().filter(function (item) {
                return item.name.toLowerCase().indexOf(self.search.toLowerCase()) >= 0 && item.active !== false;
            });
            if (self.search != '') {
                for (var t in this.active) {
                    this.active[t].status = false;
                }
                for (var i in newList) {
                    self.active[newList[i].type].status = true;
                }
            }

            var input = document.getElementById('searchInput');
            input.onkeyup = function () {
                var key = event.keyCode || event.charCode;

                if (key == 8 || key == 46 && self.search == '') {
                    self.active = {
                        'verdura': { status: true },
                        'fruta': { status: false },
                        'almacen': { status: false }
                    }
                }
            };

            return newList.filter(function (item) {
                return self.active[item.type].status == true;
            }).sort();
        }
    }
})

// window.replybox = {
//     site: 'q8jBQaoBa2',
// };

//Scroll top on pageload
window.addEventListener('scroll', function (evt) {
    var distance_from_top = document.documentElement.scrollTop
    if (distance_from_top < 250) {
        document.getElementsByClassName("search")[0].classList.remove("fixed");
        document.getElementsByClassName("filter")[0].classList.remove("fixed");
        document.getElementById("js-top").classList.add("hide");
    }
    if (distance_from_top > 250) {
        document.getElementsByClassName("search")[0].classList.add("fixed");
        document.getElementsByClassName("filter")[0].classList.add("fixed");
        document.getElementById("js-top").classList.remove("hide");
    }
});

const scrollToTop = () => {
    let c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
        window.requestAnimationFrame(scrollToTop);
        window.scrollTo(0, c - c / 10);
    }
};
const scrollTopProducts = () => {
    let p = document.getElementById("products");
    scrollTo({top: p.offsetTop - 55, behavior:"smooth" });
};


document.getElementById("js-top").onclick = function (e) {
    e.preventDefault();
    scrollToTop();
}



