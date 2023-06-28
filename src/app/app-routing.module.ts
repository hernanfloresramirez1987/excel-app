import { HomeComponent } from './pages/home/home.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoletaspagoComponent } from './pages/boletaspago/boletaspago.component';
import { BoletasreintegroComponent } from './pages/boletasreintegro/boletasreintegro.component';
import { BoletasaguinaldoComponent } from './pages/boletasaguinaldo/boletasaguinaldo.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent
  },
  {
    path: 'inicio', component: HomeComponent
  },
  {
    path: 'boletas_pago', component: BoletaspagoComponent
  },
  {
    path: 'boletas_reintegro', component: BoletasreintegroComponent
  },
  {
    path: 'boletas_aguinaldo', component: BoletasaguinaldoComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
