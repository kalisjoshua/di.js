import {ProvidePromise, InjectPromise, Inject} from '../src/annotations';
import {Injector} from '../src/injector';
import {resolve as Q} from 'q';


class UserList {}

// An async provider.
@ProvidePromise(UserList)
function fetchUsers() {
  return Q(new UserList);
}

class SynchronousUserList {}

class UserController {
  constructor(@Inject(UserList) list) {
    this.list = list;
  }
}

class SmartUserController {
  constructor(@InjectPromise(UserList) promise) {
    this.promise = promise;
  }
}


describe('async', function() {

  it('should return a promise', function() {
    var injector = new Injector([fetchUsers]);
    var p = injector.getPromise(UserList)

    expect(p).toBePromiseLike();
  });


  it('should throw when instantiating promise provider synchronously', function() {
    var injector = new Injector([fetchUsers]);

    expect(() => injector.get(UserList))
        .toThrowError('Cannot instantiate UserList synchronously. It is provided as a promise!');
  });


  it('should return promise even if the provider is sync', function() {
    var injector = new Injector();
    var p = injector.getPromise(SynchronousUserList);

    expect(p).toBePromiseLike();
  });


  // regression
  it('should return promise even if the provider is sync, from cache', function() {
    var injector = new Injector();
    var p1 = injector.getPromise(SynchronousUserList);
    var p2 = injector.getPromise(SynchronousUserList);

    expect(p2).toBePromiseLike();
  });


  it('should return promise when a dependency is async', function(done) {
    var injector = new Injector([fetchUsers]);

    injector.getPromise(UserController).then(function(userController) {
      expect(userController).toBeInstanceOf(UserController);
      expect(userController.list).toBeInstanceOf(UserList);
      done();
    });
  });


  it('should throw when a dependency is async', function() {
    var injector = new Injector([fetchUsers]);

    expect(() => injector.get(UserController))
        .toThrowError('Cannot instantiate UserList synchronously. It is provided as a promise! (UserController -> UserList)');
  });


  it('should resolve synchronously when async dependency requested as a promise', function() {
    var injector = new Injector([fetchUsers]);
    var controller = injector.get(SmartUserController);

    expect(controller).toBeInstanceOf(SmartUserController);
    expect(controller.promise).toBePromiseLike();
  });
});
