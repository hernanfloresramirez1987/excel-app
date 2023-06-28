import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DataTablesModule } from "angular-datatables";
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ComponentsModule } from './components/components.module';
import { BoletaspagoComponent } from './pages/boletaspago/boletaspago.component';
import { BoletasreintegroComponent } from './pages/boletasreintegro/boletasreintegro.component';
import { BoletasaguinaldoComponent } from './pages/boletasaguinaldo/boletasaguinaldo.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BoletaspagoComponent,
    BoletasreintegroComponent,
    BoletasaguinaldoComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    DataTablesModule,
    HttpClientModule,
    NgbModule,
    ComponentsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }