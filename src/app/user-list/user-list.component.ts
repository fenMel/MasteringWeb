import { Component, OnInit } from '@angular/core';
import { User } from '../services/user.model';
import {UserService} from '../services/user.service';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';

@Component({
  selector: 'app-users-list',
  standalone: true,
  templateUrl: 'user-list.component.html',
  imports: [
    FormsModule,
    NgClass,
    CommonModule
  ],
  styleUrls: ['user-list.component.scss']
})
export class UsersListComponent implements OnInit {
  private originalUsers: User[] = [];
  users: User[] = [];
  loading = true;
  error = false;
  searchTerm = '';
  currentPage = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 15, 20];
  totalItems = 0;
  totalPages = 0;
  sortColumn = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    // @ts-ignore
    this.userService.getAllUsers().subscribe({
      complete(): void {},
      next: (users: User[]) => {
        if (Array.isArray(users)) {
          this.originalUsers = users;
        } else {
          console.error('Expected an array of users, but got:', users);
          this.originalUsers = [];
        }
        this.applySearchAndSort();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  applySearchAndSort() {
    let filteredUsers = this.originalUsers.filter(user =>
      user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    filteredUsers.sort((a, b) => {
      const valueA = a[this.sortColumn as keyof User];
      const valueB = b[this.sortColumn as keyof User];

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.totalItems = filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.users = filteredUsers.slice(startIndex, endIndex);
    this.loading = false;
  }

  onSearchChange() {
    this.currentPage = 0;
    this.applySearchAndSort();
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 0;
    this.applySearchAndSort();
  }

  changeSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySearchAndSort();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  onVoirUser(user: User) {
    console.log('Voir user:', user);
  }

  onDeleteUser(user: User) {
    console.log('Delete user:', user);
    this.originalUsers = this.originalUsers.filter(u => u.id !== user.id);
    this.applySearchAndSort();
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.applySearchAndSort();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.applySearchAndSort();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.applySearchAndSort();
    }
  }

  protected readonly Math = Math;
}
