export class NormalResponseDto<T> {
  data: T;

  constructor(data: T) {
    this.data = data;
  }
}
