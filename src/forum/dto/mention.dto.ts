export class MentionDto {
  type: 'USER' | 'ROLE' | 'GROUPE' | 'TOUS';
  valeur: string;
  userId: string; // Rendre userId obligatoire
}
