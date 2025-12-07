module github.com/fleetflow/backend/cmd/api-gateway

go 1.21

require (
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.18.1
	google.golang.org/grpc v1.59.0
	google.golang.org/protobuf v1.31.0
	github.com/fleetflow/backend v0.0.0-00010101000000-000000000000
)

replace github.com/fleetflow/backend => ../../

require (
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/joho/godotenv v1.5.1 // indirect
	golang.org/x/net v0.17.0 // indirect
	golang.org/x/sys v0.13.0 // indirect
	golang.org/x/text v0.13.0 // indirect
	google.golang.org/genproto v0.0.0-20231016165738-49dd2c1f3d0b // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20231016165738-49dd2c1f3d0b // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20231016165738-49dd2c1f3d0b // indirect
)
