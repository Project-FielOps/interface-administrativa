import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { UsersService } from '../users.service';
import { User } from '../../../core/models/user.model';
import { StateContainerComponent } from '../../../shared/components/state-container/state-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { UiState, errorState, extractErrorMessage, loadingState, successState } from '../../../shared/components/state-container/ui-state';
import { UserFormDialogComponent } from '../form-dialog/user-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatPaginatorModule,
    StateContainerComponent,
    PageHeaderComponent,
  ],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  readonly displayedColumns = ['name', 'email', 'role', 'status', 'phone', 'actions'];
  readonly state = signal<UiState<User[]>>(loadingState());
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly filterForm = this.fb.group({
    search: [''],
    role: [''],
    status: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly usersService: UsersService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
    this.filterForm.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  load(): void {
    this.state.set(loadingState());
    const { search, role, status } = this.filterForm.getRawValue();
    this.usersService
      .list({ search: search || undefined, role: role || undefined, status: status || undefined, page: this.pageIndex(), size: this.pageSize(), sort: 'name,asc' })
      .subscribe({
        next: (page) => {
          this.totalElements.set(page.totalElements);
          this.state.set(successState(page.content, page.content.length === 0));
        },
        error: (err) => this.state.set(errorState(extractErrorMessage(err))),
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(UserFormDialogComponent, { width: '520px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Usuário criado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  openEdit(user: User): void {
    const ref = this.dialog.open(UserFormDialogComponent, { width: '520px', data: { user } });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Usuário atualizado com sucesso.', 'Fechar', { duration: 3000 });
        this.load();
      }
    });
  }

  changeStatus(user: User, action: 'activate' | 'inactivate' | 'block'): void {
    const messages = {
      activate: { title: 'Ativar usuário', message: `Ativar o acesso de ${user.name}?` },
      inactivate: { title: 'Inativar usuário', message: `Inativar o acesso de ${user.name}?` },
      block: { title: 'Bloquear usuário', message: `Bloquear o acesso de ${user.name}? Ele não poderá mais fazer login.` },
    }[action];

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: messages.title, message: messages.message, danger: action === 'block' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      const call = this.usersService[action](user.id);
      call.subscribe({
        next: () => {
          this.snackBar.open('Status atualizado.', 'Fechar', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }

  resetPassword(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Redefinir senha',
        message: `Gerar uma nova senha temporária para ${user.name}?`,
        confirmLabel: 'Redefinir',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.usersService.resetPassword(user.id).subscribe({
        next: (res) => {
          const msg = res.temporaryPassword
            ? `Senha redefinida. Senha temporária: ${res.temporaryPassword}`
            : 'Senha redefinida. O usuário receberá instruções por e-mail.';
          this.snackBar.open(msg, 'Fechar', { duration: 8000 });
        },
        error: (err) => this.snackBar.open(extractErrorMessage(err), 'Fechar', { duration: 5000 }),
      });
    });
  }
}
