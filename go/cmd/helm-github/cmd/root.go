package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/shurcooL/githubv4"
	"github.com/spf13/cobra"
	"golang.org/x/oauth2"
)

var (
	githubClient *githubv4.Client
	token        string
	flagDebug    bool
)

var rootCmd = &cobra.Command{
	Use:   "helm-github",
	Short: "Manage Helm repositories on Github Releases",
	Long:  ``,
}

// Execute executes the CLI
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(func() {
		src := oauth2.StaticTokenSource(
			&oauth2.Token{AccessToken: os.Getenv("GITHUB_TOKEN")},
		)
		httpClient := oauth2.NewClient(context.Background(), src)
		githubClient = githubv4.NewClient(httpClient)
	})
	rootCmd.PersistentFlags().StringVar(&token, "token", "", "token to use or GitHub API")
	rootCmd.PersistentFlags().BoolVar(&flagDebug, "debug", false, "activate debug")
}
