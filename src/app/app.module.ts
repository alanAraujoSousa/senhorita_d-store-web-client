import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { HomeComponent } from './components/home/home.component';
import { ProductComponent } from './components/product/product.component';
import { ThankyouComponent } from './components/thankyou/thankyou.component';
import { CartComponent } from './components/cart/cart.component'
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { EmailValidator, FormsModule, NG_ASYNC_VALIDATORS, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { GoogleLoginProvider, SocialLoginModule, AuthServiceConfig } from 'angularx-social-login';
import { RegisterComponent } from './components/register/register.component'

let config: AuthServiceConfig = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider('549565092163-1og1rfbu964rpspsvsr2jfve3dhh288h.apps.googleusercontent.com')
  }
]);
export function provideConfig() {
  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    CheckoutComponent,
    HomeComponent,
    ProductComponent,
    ThankyouComponent,
    CartComponent,
    LoginComponent,
    ProfileComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NoopAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgxSpinnerModule,
    ToastrModule.forRoot(),
    SocialLoginModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
