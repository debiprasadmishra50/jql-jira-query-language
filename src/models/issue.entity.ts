import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

/**
 * Represents an Issue entity in the database.
 */
@Entity()
export class Issue {
  /**
   * Unique identifier for the issue.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Title of the issue.
   */
  @Column()
  title: string;

  /**
   * Description of the issue.
   */
  @Column()
  description: string;

  /**
   * Status of the issue (e.g., open, in progress, closed).
   */
  @Column()
  status: string;

  /**
   * Assignee of the issue.
   */
  @Column()
  assignee: string;

  /**
   * Priority of the issue (e.g., high, medium, low).
   */
  @Column()
  priority: string;

  /**
   * Date when the issue was resolved (nullable).
   */
  @Column({ nullable: true })
  resolved: Date;

  /**
   * Date when the issue was created.
   */
  @Column()
  created_at: Date;

  /**
   * Date when the issue was last updated.
   */
  @Column()
  updated_at: Date;
}
