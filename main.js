//vrde.club

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
        fieldsMissing: true,
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

        let discounts = [
            { amount: "1", price: 55 },
            { amount: "2", price: 52.50 },
            { amount: "3", price: 50 },
            { amount: "4", price: 47.50 },
            { amount: "5+", price: 45 }
            //{ amount: "60 > 200", price: 41 },
            //{ amount: "200 > 250", price: 36 },
            //{ amount: "250 >", price: 32 }
        ]

        this.discounts = discounts;
    },
    methods: {
        setProducts: function(products){
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
                    this.cart[item].total = this.cart[item].amount * this.cart[item].price;
                    this.cart[item].total = parseFloat(this.cart[item].total.toFixed(2))
                    this.cartHas.fruta = true;
                }
                if (this.cart[item].type == 'verdura') {
                    this.cart[item].price = this.price;
                    this.cart[item].total = this.cart[item].amount * this.price;
                    this.cartHas.verdura = true;
                }
                if (this.cart[item].type == "almacen") {
                    this.cart[item].total = this.cart[item].amount * this.cart[item].price;
                    this.cart[item].total = parseFloat(this.cart[item].total.toFixed(2))
                    this.cartHas.almacen = true;

                }
                this.cartTotal += this.cart[item].total;
                this.cartTotal = parseFloat(this.cartTotal.toFixed(2))
            }

        },
        addItem: function (item) {
            item.amount++;
            if (item.price && item.type != "verdura") {
                item.total = item.amount * item.price;
            } else {
                item.total = item.amount * this.price;
            }
            this.getTotal();
        },
        removeItem: function (item) {
            this.getTotal();

            if (item.amount > 0) {
                item.amount--;
            }
            if (item.price && item.type != "verdura") {
                item.total = item.amount * item.price;
            } else {
                item.price = this.price;
                item.total = item.amount * this.price;
            }
            this.getTotal();
        },
        updateValue: function (item) {
            if (item.amount == '' || parseFloat(item.amount) == NaN) { item.amount = 0 }
            else (item.amount = parseFloat(item.amount))
            if (item.price != 0) {
                item.total = item.amount * item.price;
            } else {
                item.total = item.amount * this.price;
            }
            this.getTotal();
        },
        saveSale: function (cart) {

            // form validation
            if (this.userData.name == '' || this.userData.phone == '') {
                this.fieldsMissing = true;
            }
            if (this.userData.delivery == true && this.userData.address == '') {
                this.fieldsMissing = true;
            }
            else {
                this.fieldsMissing = false;
            }

            if (this.fieldsMissing == false) {

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
                    items:[]
                }];

                for (var item in cart) {
                    if(item.price === 0){
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
                
                
                // ref.child("users").orderByChild("name").equalTo(sale.name).once("value",snapshot => {
                //     if (snapshot.exists()){
                //     const userData = snapshot.val();
                //       var userReg = {
                //           name: sale.name,
                //           address: sale.address,
                //           phone: sale.phone
                //       }
                //       database.ref('users').push(userReg, function(){
                //           if (error) {
                //               console.log(error)
                //           } else {
                //               console.log('User already exists') 
                //           }
                //       })
                //     } else {
                //         console.log("exists!", userData);
                //     }
                // });

            }
        },
        //toggle category buttons
        setVisibility: function (type) {
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

