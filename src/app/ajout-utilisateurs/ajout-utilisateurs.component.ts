import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {UserService} from '../services/user.service';
import {User} from '../services/user.model';


@Component({
  selector: 'ajout-utilisateurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ajout-utilisateurs.component.html',
  styleUrls: ['./ajout-utilisateurs.component.scss']
})
export class AjoutUtilisateurs implements OnInit {
  @Input() userId?: string; // Pour le mode édition

  userForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  isEditMode = false;

  // Liste des rôles disponibles
  roles = [
    { value: 'CORDINATEUR', label: 'Coordinateur' },
    { value: 'JURY', label: 'Jury' },
    { value: 'CANDIDAT', label: 'Candidat' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Si un ID est fourni, charger les données de l'utilisateur
    if (this.userId) {
      this.isEditMode = true;
      this.loadUserData();
    }
  }

  initForm(): void {
    // Initialisation du formulaire avec les valeurs par défaut ou vides
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleName: ['COORDINATEUR', Validators.required]
    });

    // Si ce n'est pas le mode édition, initialiser avec les valeurs par défaut
    if (!this.isEditMode) {
      this.userForm.patchValue({
        nom: '',
        prenom: '',
        email: '',
        password: ''
      });
    }
  }

  loadUserData(): void {
    if (!this.userId) return;

    this.userService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        // Remplir le formulaire avec les données de l'utilisateur
        this.userForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          // Le mot de passe est généralement omis lors de l'édition
          // ou géré différemment selon votre logique d'application
          roleName: user.roleName
        });

        // Si c'est une édition, on peut rendre le mot de passe optionnel
        if (this.isEditMode) {
          this.userForm.get('password')?.clearValidators();
          this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
          this.userForm.get('password')?.updateValueAndValidity();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        this.errorMessage = 'Impossible de charger les données de l\'utilisateur.';
        this.submitError = true;
      }
    });
  }

  // Getters pour faciliter l'accès aux formControls dans le template
  get nom() { return this.userForm.get('nom'); }
  get prenom() { return this.userForm.get('prenom'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get roleName() { return this.userForm.get('roleName'); }

  onSubmit(): void {
    // Marquer tous les champs comme touchés pour déclencher les validations
    this.userForm.markAllAsTouched();

    if (this.userForm.valid) {
      this.isSubmitting = true;
      this.submitSuccess = false;
      this.submitError = false;

      // Récupération des données du formulaire
      const userData: User = this.userForm.value;

      // Si le mot de passe est vide en mode édition, le supprimer des données
      if (this.isEditMode && !userData.password) {
        // @ts-ignore
        delete userData.password;
      }

      // Appel au service selon le mode (création ou édition)
      const request = this.isEditMode
        ? this.userService.updateUser(this.userId!, userData)
        : this.userService.createUser(userData);

      request.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submitSuccess = true;

          // Réinitialiser le message de succès après 3 secondes
          setTimeout(() => {
            this.submitSuccess = false;
          }, 3000);

          console.log(userData)
          console.log('Utilisateur enregistré avec succès:', response);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.submitError = true;
          this.errorMessage = error?.error?.message || 'Une erreur est survenue lors de l\'enregistrement';


          console.log(userData)

          console.error('Erreur lors de l\'enregistrement:', error);
        }
      });
    }
  }
}
