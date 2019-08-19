//vrde.club

var app = new Vue({
    el: '#app',
    data: {
        search: "",
        price: 50,
        discounts: discounts,
        productList: products,
        cartTotal: 0,
        cart: [],
        cartItems: 0,
        saleComplete: false,
        fieldsMissing: true,
        userData: {
            name: "",
            address: "",
            phone: "",
            email: "",
            delivery: false
        },
        active: {
            'veggie': { status: true },
            'fruit': { status: false },
            'meal': { status: false }
        },
        cartHas: {
            veggie: false,
            fruit: false,
            meal: false
        }

    },
    methods: {
        getTotal: function () {

            var self = this;
            this.cartTotal = 0;
            this.cartItems = 0;

            this.cart = this.productList.filter(function (item) {
                return item.total > 0;
            });

            

            for (var item in this.cart) {
                if (this.cart[item].type == 'fruit') {
                    this.cart[item].total = this.cart[item].amount * this.cart[item].price;
                    this.cart[item].total = parseFloat(this.cart[item].total.toFixed(2))
                    this.cartHas.fruit = true;
                }
                if (this.cart[item].type == 'veggie') {
                    this.cart[item].price = this.price;
                    this.cart[item].total = this.cart[item].amount * this.price;
                    this.cartHas.veggie = true;
                }
                if (this.cart[item].type == "meal") {
                    this.cart[item].total = this.cart[item].amount * this.cart[item].price;
                    this.cart[item].total = parseFloat(this.cart[item].total.toFixed(2))
                    this.cartHas.meal = true;

                }
                this.cartTotal += this.cart[item].total;
                this.cartTotal = parseFloat(this.cartTotal.toFixed(2))
            }

        },
        addItem: function (item) {
            item.amount++;
            if (item.price && item.type != "veggie") {
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
            if (item.price && item.type != "veggie") {
                item.total = item.amount * item.price;
            } else {
                console.log("Remove Item", this.price, item.price)
                item.price = this.price;
                item.total = item.amount * this.price;
            }
            this.getTotal();
        },
        updateValue: function (item) {
            if (item.amount == "" || parseFloat(item.amount) == NaN) { item.amount = 0 }
            else (item.amount = parseFloat(item.amount))
            if (item.price) {
                item.total = item.amount * item.price;
            } else {
                item.total = item.amount * this.price;
            }
            this.getTotal();
        },
        saveSale: function (cart) {

            // form validation
            if (this.userData.name == "" || this.userData.phone == "") {
                this.fieldsMissing = true;
                console.log(this.fieldsMissing)
            }
            if (this.userData.delivery == true && this.userData.address == "") {
                this.fieldsMissing = true;
                console.log(this.fieldsMissing)
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
                    total: this.cartTotal
                }];

                for (var item in cart) {
                    sale.push({
                        variedad: cart[item].name,
                        cantidad: cart[item].amount,
                        precio: cart[item].price || this.price,
                        pago: cart[item].total
                    })
                }

                var self = this;

                database.ref('sales/' + today).push(sale, function (error) {
                    if (error) {
                        console.log(error)
                    } else {
                        self.saleComplete = true;
                    }
                });

                database.ref('salesArchive/' + today).push(sale, function (error) {
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
            this.search = "";
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
                return item.name.toLowerCase().indexOf(self.search.toLowerCase()) >= 0;
            });
            if (self.search != "") {
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

                if (key == 8 || key == 46 && self.search == "") {
                    self.active = {
                        'veggie': { status: true },
                        'fruit': { status: false },
                        'meal': { status: false }
                    }
                }
            };

            return newList.filter(function (item) {
                return self.active[item.type].status == true;
            }).sort();
        }
    }
})