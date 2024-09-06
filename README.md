# Outerbase Studio

`@outerbase/studio` enables you to easily connect and serve your database interface externally with just a simple command-line command.

```
npx @outerbase/studio sqlite.db
```

Put it behind the basic authentication

```
npx @outerbase/studio sqlite.db --user=admin --pass=123
```

## Configuration File

Connect from configuration file. `outerbase.json`

```
{
  "driver": "sqlite",
  "connection": {
    "file": "sqlite.db"
  }
}
```

`@outerbase/studio` will try to open `outerbase.json` by default if no configuration file specified

```
npx @outerbase/studio
```

You can specify the configuration file as the following

```
npx @outerbase/studio --config=other-config-file.json
```

By default, `@outerbase/studio` use port `4000`. You can specify different port

```
{
  "driver": "sqlite",
  "connection": {
    "file": "sqlite.db"
  },
  "port": 4002
}
```

You can add authentication

```
{
  "driver": "sqlite",
  "connection": {
    "file": "sqlite.db"
  },
  "port": 4002,
  "auth": {
    "user": "admin",
    "pass": "123"
  }
}
```

## Drivers

### sqlite

We also support sqlite ATTACH

```
{
  "driver": "sqlite",
  "connection": {
    "file": "sqlite.db"
    "attach": {
        "demo": "demo.db'
    }
  }
}
```

### turso

```
{
  "driver": "turso",
  "connection": {
    "url": "libsql://example.turso.io",
    "token": "xxx",
    "attach": {
      "demo": "turso-database-id-here"
    }
  }
}
```

### mysql

```
{
  "driver": "mysql",
  "connection": {
    "database": "chinook",
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "123456"
  }
}
```
