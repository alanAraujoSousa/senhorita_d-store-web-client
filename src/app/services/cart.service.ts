import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from './products.service';
import { OrderService } from './order.service';
import { environment } from 'src/environments/environment';
import { CartModelPublic, CartModelServer } from '../models/cart.model';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationExtras } from '@angular/router';
import { ProductModelServer } from '../models/product.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private serverUrl = environment.SERVER_URL;

  // Data variable to store cart data on the local storage of the user browser
  private cartDataClient: CartModelPublic = {
    total: 0,
    prodData: [{
      id: 0,
      inCart: 0
    }]
  }

  // Data variable to store cart information on the server
  private cartDataServer: CartModelServer = {
    total: 0,
    data: [{
      numInCart: 0,
      product: undefined
    }]
  }

  /* OBSERVABLES FOR THE COMPONENTS TO SUBSCRIBE */
  cartTotal$ = new BehaviorSubject<number>(0);
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer); 


  constructor(private http: HttpClient,
              private productService: ProductsService,
              private orderService: OrderService,
              private router: Router,
              private toast: ToastrService,
              private spinner: NgxSpinnerService) { 
    
    this.cartTotal$.next(this.cartDataServer.total);
    this.cartData$.next(this.cartDataServer);
  
    // Get the information from local storage ( if any )
    let info: CartModelPublic = JSON.parse(localStorage.getItem('cart'));

    // Check if the info variable is null or has some data in it
    if (info !== null && info !== undefined && info.prodData[0].inCart !== 0) {
      // Local Storage is not empty and has some information 
      this.cartDataClient = info;

      // Loop through each entry and put it in the cartDataServer object
      this.cartDataClient.prodData.forEach(p => {
        this.productService.getProduct(p.id).subscribe((actualProductInfo: ProductModelServer) => {
          if (this.cartDataServer.data[0].numInCart === 0) {
            this.cartDataServer.data[0].numInCart = p.inCart;
            this.cartDataServer.data[0].product = actualProductInfo;
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          } else {
            // CartDataServer already has some entry in it
            this.cartDataServer.data.push({
              numInCart: p.inCart,
              product: actualProductInfo
            });
            // TODO Create CalculateTotal Function and replace it here
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          }
          this.cartData$.next({... this.cartDataServer});
        });
      });
    }
  }

  AddProductToCart(id: number, quantity?: number) {
    this.productService.getProduct(id).subscribe(prod => {
      if (this.cartDataServer.data[0].product === undefined) {
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart = quantity !== undefined ? quantity : 1;
        this.CalculateTotal();
        this.cartDataClient.prodData[0].inCart = this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;        
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        this.cartData$.next({ ... this.cartDataServer});
        this.toast.success(`${prod.name} added to the cart`, `Product Added`, {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });
      } else {
        let index = this.cartDataServer.data.findIndex(p => p.product.id === prod.id); // -1 or a positive value
        
        if (index !== -1) {
          if (quantity !== undefined && quantity <= prod.quantity) {
            this.cartDataServer.data[index].numInCart = this.cartDataServer.data[index].numInCart < prod.quantity ? quantity : prod.quantity;
          } else {
            this.cartDataServer.data[index].numInCart < prod.quantity ? this.cartDataServer.data[index].numInCart++ : prod.quantity;
          }

          this.cartDataClient.prodData[index].inCart = this.cartDataServer.data[index].numInCart;
          this.CalculateTotal();
          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          this.toast.info(`${prod.name} quantity updated in the cart`, `Product Updated`, {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          });
        } else { // if product is not in the cart array
          this.cartDataServer.data.push({
            numInCart: 1,
            product: prod
          });

          this.cartDataClient.prodData.push({
            inCart: 1,
            id: prod.id
          });

          this.toast.success(`${prod.name} added to the cart`, `Product Added`, {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          });

          this.CalculateTotal();
          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          this.cartData$.next({ ... this.cartDataServer });
        }
      }
    });
  }

  UpdateCartItems(index: number, increase: boolean) {
    let data = this.cartDataServer.data[index];

    if (increase) {
      data.numInCart < data.product.quantity ? data.numInCart++ : data.product.quantity;
      this.cartDataClient.prodData[index].inCart = data.numInCart;
    
      // TODO CALCULATE TOTAL AMOUNT
      this.cartDataClient.total = this.cartDataServer.total;
      localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      this.cartData$.next({ ... this.cartDataServer });
    } else {
      data.numInCart--;

      if (data.numInCart < 1) {
        // TODO DELETE THE PRODUCT FROM CART
        this.cartData$.next({ ... this.cartDataServer });
      } else {
        this.cartData$.next({ ... this.cartDataServer });
        this.cartDataClient.prodData[index].inCart = data.numInCart;
        // TODO CALCULATE TOTAL AMOUNT
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }
    }
  }

  DeleteProductFromCart(index: number) {
    if (window.confirm('Are you sure you want to remove the item?')) {
      this.cartDataServer.data.splice(index, 1);
      this.cartDataClient.prodData.splice(index, 1);
      // TODO CALCULATE TOTAL AMOUNT
      this.cartDataClient.total = this.cartDataServer.total;

      if (this.cartDataClient.total === 0) {
        this.cartDataClient = { total: 0, prodData: [{ inCart: 0, id: 0 }]}
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      } else {
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }

      if (this.cartDataServer.total === 0) {
        this.cartDataServer = { total: 0, data: [{ numInCart: 0, product: undefined }] }
        this.cartData$.next({ ... this.cartDataServer });
      } else {
        this.cartData$.next({ ... this.cartDataServer });
      }
    } else {
      // IF THE USER CLICKS THE CANCEL BUTTON
      return;
    }
  }

  CheckoutFromCart(userId: number) {
    this.http.post(`${this.serverUrl}/orders/payment`, null).subscribe((res: {success: boolean}) => {
      if (res.success) {
        this.resetServerData();
        this.http.post(`${this.serverUrl}/orders/`, {
          userId: userId,
          products: this.cartDataClient.prodData
        }).subscribe((data: OrderResponse) => {
          
          this.orderService.getSingleOrder(data.order_id).then(prods => {
            if (data.success) {
              const navigationExtras: NavigationExtras = {
                state: {
                  message: data.message,
                  products: prods,
                  orderId: data.order_id,
                  total: this.cartDataClient.total
                }
              };

              this.spinner.hide().then();
              this.router.navigate(['/thankyou'], navigationExtras).then(p => {
                this.cartDataClient = {total: 0, prodData: [{inCart: 0, id: 0}]};
                this.cartTotal$.next(0);
                localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
              });            
            }
          });
        });
      } else {
        this.spinner.hide().then();
        this.router.navigateByUrl('/checkout').then();
        this.toast.error(`Sorry, failed to book the order`, `Order Status`, {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });
      }
    });
  }

  private CalculateTotal() {
    let total = 0;

    this.cartDataServer.data.forEach(p => {
      const { numInCart } = p;
      const { price } = p.product;
      
      total += numInCart * price;
    });
    this.cartDataServer.total = total;
    this.cartTotal$.next(this.cartDataServer.total);
  }

  private resetServerData() {
    this.cartDataServer = {
      total: 0, 
      data: [{
        numInCart: 0,
        product: undefined
      }]
    };

    this.cartData$.next({ ... this.cartDataServer});
  }

}

interface OrderResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [{
    id: string,
    numInCart: string
  }];
}
