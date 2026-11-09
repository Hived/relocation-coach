export interface CodingLesson {
  id: string;
  week: number;
  title: string;
  points: string;
}

export const CODING_LESSONS: CodingLesson[] = [
  // Week 1 — C# basics
  { id: "w1-types", week: 1, title: "Variables, types & value vs reference", points: "int/double/decimal/bool/string/char, var, const, value types vs reference types, null, nullable types (int?), string immutability" },
  { id: "w1-control", week: 1, title: "Control flow", points: "if/else, switch expressions, for, foreach, while, break/continue, ternary operator" },
  { id: "w1-methods", week: 1, title: "Methods", points: "parameters, return values, overloading, optional/named parameters, ref/out, expression-bodied members, static methods" },
  { id: "w1-arrays-strings", week: 1, title: "Arrays & strings", points: "arrays, indexing, Length, loops over arrays, string methods (Split, Join, Substring, ToUpper, Contains), StringBuilder, string interpolation" },
  { id: "w1-class-struct", week: 1, title: "class vs struct", points: "reference vs value semantics, copying behavior, when to use struct, records (record class / record struct) basics" },
  // Week 2 — OOP
  { id: "w2-classes", week: 2, title: "Classes, objects & constructors", points: "fields vs properties, constructors, primary constructors, object initializers, this, static vs instance members" },
  { id: "w2-encapsulation", week: 2, title: "Encapsulation", points: "access modifiers (public, private, protected, internal), properties with validation, init-only setters, why hide state" },
  { id: "w2-inheritance", week: 2, title: "Inheritance & polymorphism", points: "base classes, virtual/override, abstract classes, sealed, base keyword, polymorphism with real examples" },
  { id: "w2-interfaces", week: 2, title: "Interfaces", points: "interface vs abstract class, implementing multiple interfaces, programming to an interface, default interface methods" },
  // Week 3 — Collections + LINQ
  { id: "w3-collections", week: 3, title: "Collections", points: "List<T>, Dictionary<K,V>, HashSet<T>, Queue/Stack, IEnumerable<T> vs ICollection<T> vs IList<T>, choosing the right collection, Big-O of common operations" },
  { id: "w3-generics", week: 3, title: "Generics", points: "generic methods and classes, constraints (where T : ...), why generics avoid boxing" },
  { id: "w3-linq", week: 3, title: "LINQ & deferred execution", points: "Where/Select/OrderBy/GroupBy/Any/All/First/Single, deferred vs immediate execution (ToList, Count), multiple enumeration pitfalls, IEnumerable vs IQueryable" },
  { id: "w3-exceptions", week: 3, title: "Exceptions", points: "try/catch/finally, throw vs throw ex, custom exceptions, when NOT to use exceptions, using statement and IDisposable" },
  // Week 4 — Professional .NET
  { id: "w4-solid", week: 4, title: "SOLID principles", points: "each principle with a small C# before/after example" },
  { id: "w4-di", week: 4, title: "Dependency injection", points: "constructor injection, why it gives loose coupling and testability, ASP.NET Core service lifetimes (Transient, Scoped, Singleton), captive dependency problem" },
  { id: "w4-async", week: 4, title: "async/await", points: "Task, async/await is about not blocking while waiting (not parallelism), I/O-bound vs CPU-bound, why .Result/.Wait() block and can deadlock, ConfigureAwait basics, Task.WhenAll, CancellationToken" },
  { id: "w4-aspnet", week: 4, title: "ASP.NET Core basics", points: "minimal APIs vs controllers, routing, middleware pipeline, configuration, logging, model binding and validation" },
];

export const FRENCH_TOPICS: string[] = [
  "Présent of être, avoir, aller, faire (most used verbs)",
  "Présent of pouvoir, vouloir, devoir, savoir",
  "Présent of -er verbs + prendre, venir, dire, voir",
  "Articles le/la/les, un/une/des, du/de la (and noun gender tips)",
  "Negation (ne...pas, ne...jamais, ne...rien) and asking questions",
  "Futur proche (aller + infinitif)",
  "Passé composé with avoir",
  "Passé composé with être (movement verbs) and agreement",
  "Imparfait (description, habits)",
  "Passé composé vs imparfait",
  "Futur simple",
  "Pronouns COD/COI: le, la, les, lui, leur",
  "Pronouns y and en",
  "Relative pronouns qui, que, où, dont",
  "Conditionnel présent (politeness, wishes)",
  "Subjonctif présent (il faut que, je veux que)",
  "Connectors: cependant, donc, pourtant, en effet, par conséquent",
  "Formal email and cover letter in French",
  "Giving and defending an opinion (DELF B1/B2 style)",
  "Job interview in French",
];
