import { CommonModule } from '@angular/common';
import { Component, Input, afterRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../../home/service/cart.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

declare function MODAL_PRODUCT_DETAIL([]):any;
declare function MODAL_QUANTITY([]):any;
declare var $:any;
@Component({
  selector: 'app-modal-product',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './modal-product.component.html',
  styleUrl: './modal-product.component.css'
})
export class ModalProductComponent {

  @Input() product_selected:any;
  variation_selected:any;
  sub_variation_selected:any;

  currency:string = 'PEN';
  plus:number = 0;
  constructor(
    private toastr: ToastrService,
    private router: Router,
    private cartService: CartService,
    public cookieService: CookieService,
  ) {

    // afterRender(() => {
    //   this.currency = this.cookieService.get("currency") ? this.cookieService.get("currency") : 'PEN';
    // })
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(this.product_selected);
    this.currency = this.cookieService.get("currency") ? this.cookieService.get("currency") : 'PEN';
    setTimeout(() => {
      MODAL_PRODUCT_DETAIL($);
      MODAL_QUANTITY($);
    }, 50);
  }

  getNewTotal(PRODUCT:any,DISCOUNT_FLASH_P:any){
    if(this.currency == 'PEN'){
      if(DISCOUNT_FLASH_P.type_discount == 1){//% DE DESCUENT0 50
        // 100 / 100*(50*0.01) 100*0.5=50
        return ((PRODUCT.price_pen+this.plus) - (PRODUCT.price_pen+this.plus)*(DISCOUNT_FLASH_P.discount*0.01)).toFixed(2)
      }else{//-PEN/-USD 
        return ((PRODUCT.price_pen+this.plus) - DISCOUNT_FLASH_P.discount).toFixed(2);
      }
    }else{
      if(DISCOUNT_FLASH_P.type_discount == 1){//% DE DESCUENT0 50
        // 100 / 100*(50*0.01) 100*0.5=50
        return ((PRODUCT.price_usd+this.plus) - (PRODUCT.price_usd+this.plus)*(DISCOUNT_FLASH_P.discount*0.01)).toFixed(2)
      }else{//-PEN/-USD 
        return ((PRODUCT.price_usd+this.plus) - DISCOUNT_FLASH_P.discount).toFixed(2);
      }
    }
  }

  getTotalPriceProduct(PRODUCT:any){
    if(PRODUCT.discount_g){
      return this.getNewTotal(PRODUCT,PRODUCT.discount_g);
    }
    if(this.currency == 'PEN'){
      return PRODUCT.price_pen + this.plus;
    }else{
      return PRODUCT.price_usd + this.plus;
    }
  }
  getTotalCurrency(PRODUCT:any){
    if(this.currency == 'PEN'){
      return PRODUCT.price_pen;
    }else{
      return PRODUCT.price_usd;
    }
  }
  selectedVariation(variation:any){
    this.variation_selected = null;
    this.sub_variation_selected = null;
    this.plus = 0;
    setTimeout(() => {
      this.plus += variation.add_price;
      this.variation_selected = variation;
      MODAL_PRODUCT_DETAIL($);
    }, 50);
  }
  selectedSubVariation(subvariation:any){
    this.sub_variation_selected = null;
    this.plus =  this.variation_selected.add_price;
    setTimeout(() => {
      this.plus += subvariation.add_price;
      this.sub_variation_selected = subvariation;
    }, 50);
  }
  addCart(){
    if(!this.cartService.authService.user){
      this.toastr.error("Validacion","Ingrese a la tienda");
      this.router.navigateByUrl("/login");
      return;
    }

    let product_variation_id = null;
    if(this.product_selected.variations.length > 0){
      if(!this.variation_selected){
        this.toastr.error("Validacion","Necesitas seleccionar una variación");
        return;
      }
      if(this.variation_selected && this.variation_selected.subvariations.length > 0){
        if(!this.sub_variation_selected){
          this.toastr.error("Validacion","Necesitas seleccionar una SUB variación");
          return;
        }
      }
    }

    if(this.product_selected.variations.length > 0 && this.variation_selected &&
      this.variation_selected.subvariations.length == 0){
      product_variation_id = this.variation_selected.id;
    }
    if(this.product_selected.variations.length > 0 && this.variation_selected &&
      this.variation_selected.subvariations.length > 0){
      product_variation_id = this.sub_variation_selected.id;
    }

    let discount_g = null;

    if(this.product_selected.discount_g){
      discount_g = this.product_selected.discount_g;
    }

    let data = {
      product_id: this.product_selected.id,
      type_discount: discount_g ? discount_g.type_discount : null,
      discount: discount_g ? discount_g.discount : null,
      type_campaing: discount_g ? discount_g.type_campaing : null,
      code_cupon: null,
      code_discount: discount_g ? discount_g.code : null,
      product_variation_id: product_variation_id,
      quantity: $("#tp-cart-input-val").val(),
      price_unit:this.currency == 'PEN' ? this.product_selected.price_pen : this.product_selected.price_usd,
      subtotal: this.getTotalPriceProduct(this.product_selected),
      total: this.getTotalPriceProduct(this.product_selected)*$("#tp-cart-input-val").val(),
      currency: this.currency,
    }

    this.cartService.registerCart(data).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toastr.error("Validacion",resp.message_text);
      }else{
        this.cartService.changeCart(resp.cart);
        this.toastr.success("Exitos","El producto se agrego al carrito de compra");
      }
    },err => {
      console.log(err);
    })
  }
}
