import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  messageId: number;

  @Column()
  pair: string;

  @Column()
  action: string;

  @Column({ default: false })
  closed: boolean;

  @Column({ type: 'int', default: 0 })
  yesVotes: number;

  @Column({ type: 'int', default: 0 })
  noVotes: number;

  @Column({ nullable: true })
  result: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
