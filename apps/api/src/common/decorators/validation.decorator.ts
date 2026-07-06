import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(dateStr: string, args: ValidationArguments) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    return date <= now;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} cannot be a future date`;
  }
}

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPastDateConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsNotPurelyNumericConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (typeof text !== 'string') return false;
    return !/^\d+$/.test(text);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} cannot be purely numeric`;
  }
}

export function IsNotPurelyNumeric(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPurelyNumericConstraint,
    });
  };
}
