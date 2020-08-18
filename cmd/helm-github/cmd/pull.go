package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/shurcooL/githubv4"
	"github.com/spf13/cobra"
)

var (
	owner string
	repo  string
)

func init() {
	rootCmd.AddCommand(pullCmd)
}

var pullCmd = &cobra.Command{
	Use:   "pull",
	Short: "Pull releases from GitHub",
	Run: func(cmd *cobra.Command, args []string) {

		type ReleaseAsset struct {
			Url string
		}

		type Release struct {
			Name                   string
			ReleaseAssetConnection struct {
				Nodes []ReleaseAsset
			} `graphql:"releaseAssets(last: 100)"`
		}

		var query struct {
			Repository struct {
				Description       string
				CreatedAt         string
				ReleaseConnection struct {
					Nodes []Release
				} `graphql:"releases(last: 100)"`
			} `graphql:"repository(owner: $owner, name: $name)"`
		}

		err := githubClient.Query(context.Background(), &query, map[string]interface{}{
			"owner": githubv4.String(os.Getenv("OWNER")),
			"name":  githubv4.String(os.Getenv("REPO")),
		})
		if err != nil {
			panic(err)
		}

		for _, release := range query.Repository.ReleaseConnection.Nodes {
			fmt.Println(release.Name)

			for _, asset := range release.ReleaseAssetConnection.Nodes {
				fmt.Println(asset.Url)
			}
		}

	},
}
