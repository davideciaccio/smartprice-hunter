import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // Reindirizza la radice al login
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'price-history',
    loadComponent: () => import('./pages/price-history/price-history.page').then( m => m.PriceHistoryPage)
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.page').then( m => m.MapPage)
  },
  {
    path: 'camera',
    loadComponent: () => import('./pages/camera/camera.page').then( m => m.CameraPage)
  },
  {
    path: 'notices',
    loadComponent: () => import('./pages/notices/notices.page').then( m => m.NoticesPage)
  },
  {
    path: 'manage-account',
    loadComponent: () => import('./pages/manage-account/manage-account.page').then( m => m.ManageAccountPage)
  },
];