import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from './products.service';
import { OrderService } from './order.service';
import { environment } from 'src/environments/environment';
import { CartModelPublic, CartModelServer } from '../models/cart.model';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ProductModelServer } from '../models/product.model';

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
              private router: Router) { 
    
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
}
