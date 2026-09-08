export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (item: T) => void;

  constructor(createFn: () => T, resetFn?: (item: T) => void, initialSize: number = 20) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  public get(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.createFn();
    }
    if (this.resetFn) {
      this.resetFn(item);
    }
    return item;
  }

  public release(item: T): void {
    if (this.resetFn) {
      this.resetFn(item);
    }
    this.pool.push(item);
  }

  public size(): number {
    return this.pool.length;
  }

  public clear(): void {
    this.pool = [];
  }
}
